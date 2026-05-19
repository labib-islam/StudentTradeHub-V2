export default function Loading({ fullScreen = false }) {
  return (
    <div className={fullScreen ? "min-h-screen flex items-center justify-center" : "flex items-center justify-center py-8"}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
    </div>
  );
}