import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react-native';
import type { IRtcEngine } from 'react-native-agora';
import { BRAND_COLORS } from '../../constants/Colors';
import { getOrCreateCallRoom } from '../../config/queries';

type AgoraModule = typeof import('react-native-agora');
type CallStatus = 'connecting' | 'joined' | 'error' | 'unsupported';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId ? String(params.sessionId) : '';

  const engineRef = useRef<IRtcEngine | null>(null);
  const [status, setStatus] = useState<CallStatus>(isExpoGo ? 'unsupported' : 'connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agoraModule, setAgoraModule] = useState<AgoraModule | null>(null);
  const [remoteUids, setRemoteUids] = useState<number[]>([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  // Calls start audio-only — camera is opt-in, so a casual voice call never
  // accidentally racks up video-tier minutes.
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // react-native-agora is a native module — it isn't present in Expo Go,
    // and even importing it there throws. Skip entirely and never touch the
    // import in that case; a real dev/production build is required.
    if (!sessionId || isExpoGo) return;
    let cancelled = false;

    const start = async () => {
      try {
        const [{ channel_name, app_id, uid, token }, agora] = await Promise.all([
          getOrCreateCallRoom(sessionId),
          import('react-native-agora'),
        ]);
        if (cancelled) return;
        setAgoraModule(agora);

        const engine = agora.createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId: app_id, channelProfile: agora.ChannelProfileType.ChannelProfileCommunication });
        engine.enableAudio();

        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            if (cancelled) return;
            setStatus('joined');
          },
          onUserJoined: (_connection, remoteUid) => {
            if (cancelled) return;
            setRemoteUids((prev) => (prev.includes(remoteUid) ? prev : [...prev, remoteUid]));
          },
          onUserOffline: (_connection, remoteUid) => {
            if (cancelled) return;
            setRemoteUids((prev) => prev.filter((id) => id !== remoteUid));
          },
          onError: (err, msg) => {
            if (cancelled) return;
            setErrorMessage(msg || `Call error (${err})`);
            setStatus('error');
          },
        });

        engine.joinChannel(token, channel_name, uid, {
          channelProfile: agora.ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: agora.ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: false,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        });
      } catch (err: any) {
        if (cancelled) return;
        setErrorMessage(err.message || 'Could not connect the call.');
        setStatus('error');
      }
    };

    start();

    return () => {
      cancelled = true;
      const engine = engineRef.current;
      engineRef.current = null;
      if (engine) {
        engine.leaveChannel();
        engine.release();
      }
    };
  }, [sessionId]);

  const handleToggleMic = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = !isMicMuted;
    engine.muteLocalAudioStream(next);
    setIsMicMuted(next);
  };

  const handleToggleCamera = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = !isCameraOn;
    if (next) engine.enableVideo();
    engine.muteLocalVideoStream(!next);
    engine.updateChannelMediaOptions({ publishCameraTrack: next });
    setIsCameraOn(next);
  };

  const handleLeaveCall = async () => {
    setIsLeaving(true);
    try {
      engineRef.current?.leaveChannel();
    } catch {
      // ignore — we're leaving the screen regardless
    } finally {
      router.back();
    }
  };

  const RtcSurfaceView = agoraModule?.RtcSurfaceView;

  if (status === 'unsupported') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorTitle}>Calling needs a development build</Text>
          <Text style={styles.errorBody}>
            In-app calls use native code that isn't available in Expo Go. Open this app from your
            development build instead to join the call.
          </Text>
          <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
            <Text style={styles.errorBackButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorTitle}>Couldn't join the call</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
            <Text style={styles.errorBackButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {status === 'connecting' || !RtcSurfaceView ? (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.connectingText}>Connecting…</Text>
        </View>
      ) : (
        <View style={styles.tileGrid}>
          {remoteUids.length === 0 && (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>Waiting for the other person to join…</Text>
            </View>
          )}
          {remoteUids.map((remoteUid) => (
            <View key={remoteUid} style={styles.tile}>
              <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.tileMedia} />
              <Text style={styles.tileLabel}>Guest</Text>
            </View>
          ))}

          {isCameraOn && (
            <View style={styles.localTile}>
              <RtcSurfaceView canvas={{ uid: 0 }} style={styles.tileMedia} />
              <Text style={styles.localTileLabel}>You</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.controlBar}>
        <TouchableOpacity style={[styles.controlButton, isMicMuted && styles.controlButtonActive]} onPress={handleToggleMic}>
          {isMicMuted ? <MicOff color="#FFFFFF" size={22} /> : <Mic color="#FFFFFF" size={22} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isCameraOn && styles.controlButtonActive]} onPress={handleToggleCamera}>
          {isCameraOn ? <Video color="#FFFFFF" size={22} /> : <VideoOff color="#FFFFFF" size={22} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCall} disabled={isLeaving}>
          <PhoneOff color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  centeredMessage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  connectingText: { color: '#E5E7EB', fontSize: 15, fontWeight: '600' },
  errorTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  errorBody: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorBackButton: { marginTop: 12, backgroundColor: BRAND_COLORS.primary, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24 },
  errorBackButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  tileGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 8, alignContent: 'flex-start' },
  waitingCard: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', padding: 32 },
  waitingText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  tile: { width: '100%', aspectRatio: 4 / 5, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1F2937', margin: 8, justifyContent: 'flex-end' },
  tileMedia: { ...StyleSheet.absoluteFillObject },
  tileLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', padding: 10 },
  localTile: { position: 'absolute', bottom: 16, right: 16, width: 100, height: 140, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1F2937', borderWidth: 2, borderColor: '#374151' },
  localTileLabel: { position: 'absolute', bottom: 6, left: 6, color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  controlBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 20 },
  controlButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  controlButtonActive: { backgroundColor: BRAND_COLORS.primary },
  leaveButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
});
