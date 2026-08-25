export default function Link({ href, className, children, ...rest }) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}