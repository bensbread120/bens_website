import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext"; // Your custom auth context

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const { user, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      await login(email, password); // Wait for login to complete
      // success will be handled in useEffect when `user` is updated
    } catch {
      setError("Invalid email or password");
    }
  };
  // commented out for production
  // const createUser = async () => {
  //   try {
  //     await create(email, password); // Wait for login to complete
  //     // success will be handled in useEffect when `user` is updated
  //   } catch (err) {
  //     setError(`Invalid email or password${err}`);
  //   }
  // }

  useEffect(() => {
    if (user) {
      setSuccess(true);
      setError("");
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">Login successful! Redirecting...</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 w-full rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 w-full rounded"
              required
            />
          </div>

          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">
            Sign In
          </button>
          {/* <button className="bg-blue-500 text-white px-4 py-2 rounded w-full mt-1" onClick={createUser}>Create</button> */}
        </form>
      </div>
    </div>
  );
}
