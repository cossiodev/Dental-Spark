
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Dashboard
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Cargando Dental Spark...</h1>
        <p className="text-xl text-gray-600">Redireccionando al panel principal</p>
      </div>
    </div>
  );
};

export default Index;
