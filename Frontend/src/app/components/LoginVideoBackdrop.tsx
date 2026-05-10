import loginBgVideo from "@/imports/66810-520427372_medium-1.mp4";

/**
 * Fixed full-viewport video + tint. Use behind any page content (z-10+).
 */
export function LoginVideoBackgroundLayer() {
  return (
    <>
      <video
        aria-hidden
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover"
      >
        <source src={loginBgVideo} type="video/mp4" />
      </video>
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-slate-900/35 via-emerald-900/25 to-indigo-900/30"
        aria-hidden
      />
    </>
  );
}

type LoginVideoBackdropProps = {
  children: React.ReactNode;
};

/**
 * Centered layout for role picker and pre-auth login cards.
 */
export function LoginVideoBackdrop({ children }: LoginVideoBackdropProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <LoginVideoBackgroundLayer />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
