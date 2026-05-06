interface Props {
  amount: number | null;
}

export default function XpPopup({ amount }: Props) {
  if (amount === null) return null;

  return <div className="xp-popup">+{amount} XP</div>;
}
