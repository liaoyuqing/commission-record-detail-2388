import type { ReactNode } from 'react';

interface SectionCardProps {
  index: string;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}

export default function SectionCard({ index, title, extra, children }: SectionCardProps) {
  return (
    <section className="section-card" aria-label={title}>
      <header className="section-card__head">
        <span className="section-card__index">{index}</span>
        <h2 className="section-card__title">{title}</h2>
        <div className="section-card__extra">{extra}</div>
      </header>
      <div className="section-card__body">{children}</div>
    </section>
  );
}
