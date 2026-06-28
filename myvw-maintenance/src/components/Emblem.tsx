/** Small chrome-ringed Beetle badge used in the app header. */
export function Emblem({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ flex: "0 0 auto" }}
    >
      <circle cx="32" cy="32" r="30" fill="#f2e9d2" stroke="#d8d2c2" strokeWidth="3" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#c14a30" strokeWidth="1.5" />
      {/* Beetle silhouette */}
      <path
        d="M14 40 q3 -18 18 -18 q13 0 16 11 q5 1 5 6 q0 3 -3 3 H16 q-3 0 -3 -3 z"
        fill="#2f5c4f"
      />
      <circle cx="24" cy="42" r="5.5" fill="#2f5c4f" stroke="#f2e9d2" strokeWidth="1.6" />
      <circle cx="42" cy="42" r="5.5" fill="#2f5c4f" stroke="#f2e9d2" strokeWidth="1.6" />
    </svg>
  );
}
