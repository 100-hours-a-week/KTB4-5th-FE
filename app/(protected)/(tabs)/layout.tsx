export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="route-shell route-shell-tabs" data-route-group="tabs">
      {children}
    </div>
  );
}
