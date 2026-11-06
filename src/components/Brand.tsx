export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#E4572E" />
      <path d="M9 25V11h3V8h3v3h2V8h3v3h3v14h-5v-6h-4v6z" fill="#FFFCF3" />
      <circle cx="24.5" cy="7.5" r="3" fill="#F3A712" />
    </svg>
  );
}
