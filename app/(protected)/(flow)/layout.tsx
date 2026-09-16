export default function FlowLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="route-shell route-shell-flow" data-route-group="flow">
      {children}
    </div>
  );
}
