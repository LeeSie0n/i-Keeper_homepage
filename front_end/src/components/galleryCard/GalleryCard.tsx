import styles from "./GalleryCard.module.css";

export interface GalleryCardProps {
  imageUrl: string;
  title: string;
  writer: string;
}

export default function GalleryCard({
  imageUrl,
  title,
  writer,
}: GalleryCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={imageUrl} alt={title} className={styles.image} />
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.writer}>{writer}</p>
      </div>
    </article>
  );
}
