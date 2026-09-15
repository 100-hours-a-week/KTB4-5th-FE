type PagePlaceholderProps = {
  screenId: string;
  title: string;
  description: string;
};

export function PagePlaceholder({
  screenId,
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <main className="app">
      <header className="appbar">
        <div className="grow">
          <p className="kicker">{screenId}</p>
          <h1 className="appbar-title">{title}</h1>
        </div>
      </header>
      <div className="screen">
        <section className="section">
          <p>{description}</p>
          <p className="meta">FSD v1 scaffold</p>
        </section>
      </div>
    </main>
  );
}
