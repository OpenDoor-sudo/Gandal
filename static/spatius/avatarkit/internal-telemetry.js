import { M as clockSync, O as trackEventOtel, R as recordMetric$1, V as setSdkIdentity$1, o as startPlaybackTrace$1, u as Message, y as clientContextFields$1 } from "./otel-trace-CZJAGjGg.js";
//#region internal-telemetry.ts
/**
* Internal telemetry surface for the companion RTC SDK.
*
* `@spatius/avatarkit-rtc` reports into the same OpenObserve backend and shares
* this SDK's OTel providers, so its spans must sit on the same calibrated
* timeline. Without that, a client whose wall clock is off puts RTC spans at a
* time that does not line up with the server-side records they need to be read
* against.
*
* Deliberately NOT re-exported from the package root: this is a bridge between
* two first-party packages, not API for integrators. It exposes conversion only
* — nothing here can alter the clock baseline.
*
* NOTE: nothing in this file may be tagged `@internal`. The dts plugin runs with
* `stripInternal: true`, which erases such declarations from the emitted `.d.ts`
* — the entry would still export both functions at runtime while shipping an
* empty `export {}` type file, leaving the RTC package with no types.
*
* @packageDocumentation
*/
/**
* Convert a `performance.now()` reading taken earlier into a timeline
* timestamp (epoch ms), preferring the server-calibrated baseline and falling
* back to the local clock until calibration completes.
*
* Collect marks on the monotonic clock and convert at report time: the wall
* clock and `performance.now()` drift apart while the main thread is blocked,
* and calibration may not have finished when the mark was taken.
*
* @param mono - the `performance.now()` value recorded at collection time
*/
function resolveMonoTimestamp(mono) {
	return clockSync.resolveMono(mono);
}
/**
* Whether clock calibration against the backend has completed. Timestamps
* resolve either way; this only reports whether they are server-aligned yet.
*/
function isClockCalibrated() {
	return clockSync.isReady();
}
/**
* Open one round's trace: `driven.request` → `playback` → the caller's spans.
*
* Shared with the RTC SDK rather than reimplemented there, so both packages
* emit the same tree. The root's ids derive from the conversation id, which is
* what lets the backend's spans join a round without threading state through;
* reproducing that separately would mean two definitions of one wire contract.
*/
function startPlaybackTrace(conversationId, startTimeMs, attrs = {}, serverTraceparent) {
	return startPlaybackTrace$1(conversationId, startTimeMs, attrs, serverTraceparent);
}
/**
* Read the W3C traceparent the driving service stamped on an animation
* message, without decoding its frames. Undefined when the message carries
* none, or is not parseable.
*
* For transports that hand the SDK an opaque animation payload and never see a
* request id — RTC being the case this exists for. There the round's id is
* minted locally and never travels upstream, so a trace_id derived from it has
* nothing to do with the server's, and one round reports as two unrelated
* traces. The traceparent riding the animation is what joins them; pass the
* result to `startPlaybackTrace`.
*
* Kept separate from decoding rather than folded into it: callers need this
* once per round while frames are decoded continuously.
*
* @param rawMessage the same bytes handed to the renderer — a serialized
*   `driveningress.v2.Message`.
*/
function peekTraceparent(rawMessage) {
	try {
		return Message.decode(rawMessage).serverResponseAnimation?.traceContext?.traceparent || void 0;
	} catch {
		return;
	}
}
/**
* Record one measurement onto avatarkit's metric pipeline.
*
* Must go through here rather than the RTC SDK reaching for the global meter
* itself: a metrics export is skipped entirely unless that round carried real
* business data, and the flag saying so lives in this module. A histogram
* written directly through the global provider lands in the same instrument but
* leaves the flag clear, so the whole batch — RTC's readings included — is
* dropped before it is sent.
*/
function recordMetric(name, value, attributes = {}) {
	recordMetric$1(name, value, attributes);
}
/**
* Emit one event onto avatarkit's OTel log channel.
*
* Must go through here rather than the RTC SDK calling `logs.getLogger().emit()`
* itself. Sharing the global LoggerProvider only carries Resource-level
* attributes (app_id / region / sdk.version); the record-level identity fields
* — `user_id`, `client_id` — are stamped inside this SDK's emit path, so a
* record emitted directly through the provider carries none of them. Routing
* through here is what the Android / iOS RTC SDKs already do via their
* `RTCTelemetry.track` entry, and it additionally picks up crash-replay
* persistence and the pre-calibration queue.
*
* The timestamp is taken here rather than accepted from the caller: this path
* resolves it against the calibrated clock and stamps `server_timestamp`
* alongside, which a caller-supplied `Date.now()` cannot do.
*/
function trackEvent(event, level = "info", contents = {}) {
	trackEventOtel(event, level, contents);
}
/**
* The client environment fields this SDK stamps on every OTel log record —
* `host`, `domain`, `url`, `pathname`, `referrer`, `user_agent`, `locale`,
* screen/viewport size and `timezone`.
*
* Shared with the RTC SDK rather than re-derived there. These are record-level
* fields, not Resource attributes: they are read from `window.location` at emit
* time because `url`/`pathname` change as a single-page app routes. Sharing the
* OTel providers therefore does not carry them across — the RTC SDK emits
* through its own logger and would report no `host` at all, which is what
* prompted this export. Re-implementing the collection on that side would let
* the two drift apart in field names and in how each value is read, and the
* backend aggregates on exactly these names.
*
* Call at emit time, once per record; spread the result before the caller's own
* properties so an explicit value at the call site still wins.
*/
function clientContextFields() {
	return clientContextFields$1();
}
/**
* Declare which SDK these records come from, as the `sdk.package` and
* `sdk.version` resource attributes.
*
* Without it every RTC record is attributed to the host SDK and carries the
* host's version, so the backend — which splits RTC traffic by exactly these
* fields — cannot tell an RTC session from a plain AvatarKit integration, and
* this SDK's own version is absent from the data entirely. The native SDKs
* declare the same pair, through a ContentProvider (Android) and a claim at
* construction (iOS).
*
* Each field applies independently: passing only one leaves the other as it
* was. The version overrides the Resource's `sdk.version`; instrumentation
* scope versions come from elsewhere and are unaffected.
*
* Must be called before `AvatarSDK.initialize()`: the values are read when the
* OTel Resource is built and are fixed from then on. Sharing a module graph
* with the host makes that ordering straightforward here, so unlike the native
* SDKs no rebuild of the signal providers is needed.
*
* @param identity - `sdkPackage` e.g. `spatius-web-rtc`; `sdkVersion` that
*   package's own version. Empty values are ignored.
*/
function setSdkIdentity(identity) {
	setSdkIdentity$1(identity);
}
//#endregion
export { clientContextFields, isClockCalibrated, peekTraceparent, recordMetric, resolveMonoTimestamp, setSdkIdentity, startPlaybackTrace, trackEvent };
