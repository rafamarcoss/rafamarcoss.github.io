export default function Image({ src, alt = '', className = '', fill, unoptimized, sizes, ...rest }) {
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className}`}
        {...rest}
      />
    );
  }
  return <img src={src} alt={alt} className={className} {...rest} />;
}