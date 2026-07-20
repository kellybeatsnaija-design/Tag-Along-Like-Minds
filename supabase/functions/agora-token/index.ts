// Mints an Agora RTC token. Stateless — no database access, no per-user auth
// of its own. The only caller is the `get_or_create_call_room` Postgres
// function (via the `http` extension), which already verified the requester
// is a real participant of the session before ever reaching this function.
// That's why authorization here is a shared secret, not a user JWT — the
// caller is Postgres itself, not a browser/app client with a session.
//
// Deploy: npx supabase functions deploy agora-token --no-verify-jwt
// Secrets: npx supabase secrets set AGORA_APP_ID=... AGORA_APP_CERTIFICATE=... INTERNAL_SECRET=...
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token@2.0.5';

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-internal-secret') !== Deno.env.get('INTERNAL_SECRET')) {
    return new Response('Forbidden', { status: 403 });
  }

  const { channelName, uid, role } = await req.json();
  if (!channelName || typeof uid !== 'number') {
    return new Response('Bad request', { status: 400 });
  }

  const appId = Deno.env.get('AGORA_APP_ID');
  const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');
  if (!appId || !appCertificate) {
    return new Response('Agora is not configured', { status: 500 });
  }

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER,
    3600, // token expire (seconds)
    3600  // privilege expire (seconds)
  );

  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
