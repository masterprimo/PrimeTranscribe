type NavbarProps = {
  title: string;
  onLogout?: () => void;
};

export default function Navbar({
  title,
  onLogout,
}: NavbarProps) {
  return (
    <header className="bg-blue-600 text-white p-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold">
        {title}
      </h1>

      {onLogout && (
        <button
          onClick={onLogout}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold"
        >
          Logout
        </button>
      )}
    </header>
  );
}