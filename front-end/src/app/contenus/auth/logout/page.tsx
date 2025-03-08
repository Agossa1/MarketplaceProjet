import LogoutButton from "@/app/components/Forms/LogoutButton";

const LogoutPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Logout</h1>
        <p className="text-gray-700 mb-6 text-center">
          Are you sure you want to logout?
        </p>
        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;


