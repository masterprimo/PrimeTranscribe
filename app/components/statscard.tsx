type StatsCardProps = {
  title: string;
  value: string | number;
  color?: string;
};

export default function StatsCard({
  title,
  value,
  color = "text-blue-600",
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-gray-500">{title}</h3>
      <p className={`text-4xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  );
}