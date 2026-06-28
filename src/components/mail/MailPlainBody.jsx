import { linkifyPlainText } from "@/utils/linkifyPlainText";

const MailPlainBody = ({ text, className }) => {
  const parts = linkifyPlainText(text);

  if (parts.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      {parts.map((part, index) =>
        part.type === "link" ? (
          <a
            key={index}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        )
      )}
    </div>
  );
};

export default MailPlainBody;
