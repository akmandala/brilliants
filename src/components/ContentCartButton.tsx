export default function ContentCartButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button className="btn-secondary relative" onClick={onClick} type="button">
      Content Cart
      <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{count}</span>
    </button>
  );
}
