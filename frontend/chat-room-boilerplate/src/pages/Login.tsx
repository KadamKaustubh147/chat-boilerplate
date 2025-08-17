import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext-http-jwt"; // ✅ FIXED
import type { FormEvent } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import SideImg from "../components/SideImg";


const Login = () => {
    const { login, googleLogin } = useContext(AuthContext)!; // ✅ non-null since you know it will be provided
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate()
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const success = await login(email, password);

        if (success) {
            navigate('/app')
        } else {
            console.log("FAIL");
        }
    };
    const googleLoginButton = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (codeResponse) => {
            console.log(codeResponse); // Will contain `code`
            await googleLogin(codeResponse.code);
            navigate("/app");
        },
        onError: () => console.log("Google Login Failed"),
    });

    return (
        <div className="w-full flex bg-black h-[100vh]">
            {/* login container left side */}
            <div className="w-full md:w-3/5 h-full flex items-center justify-center">
                <div className="w-full max-w-sm p-4 bg-white rounded-lg shadow-sm sm:p-6 md:p-8 dark:bg-black">
                    <form className="space-y-6" action="#" onSubmit={handleSubmit}>
                        <h5 className="text-xl font-medium text-gray-900 text-center dark:text-white">
                            Login to [platform]
                        </h5>
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 text-black bg-white border-gray-400 border-[1.5px] cursor-pointer font-medium rounded-lg text-sm px-5 py-2.5 text-center hover:bg-[#e6e6e6]"
                            onClick={() => googleLoginButton()}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 533.5 544.3">
                                <path
                                    fill="#4285f4"
                                    d="M533.5 278.4c0-17.4-1.5-34.2-4.3-50.6H272v95.8h147.1c-6.3 34-25 62.9-53.4 82.2v68h86.1c50.5-46.5 81.7-115.1 81.7-195.4z"
                                />
                                <path
                                    fill="#34a853"
                                    d="M272 544.3c72.8 0 133.8-24.1 178.4-65.3l-86.1-68c-24 16.1-54.8 25.6-92.3 25.6-71 0-131.3-47.9-152.8-112.2H31.4v70.7c44.8 88.7 137.1 149.2 240.6 149.2z"
                                />
                                <path
                                    fill="#fbbc04"
                                    d="M119.2 324.4c-10.2-30-10.2-62.4 0-92.4V161.3H31.4c-43.1 86.2-43.1 188.2 0 274.4l87.8-68.2z"
                                />
                                <path
                                    fill="#ea4335"
                                    d="M272 107.2c39.6-.6 77.8 13.6 107.1 38.9l80-80C407.5 23.6 341.3 0 272 0 168.5 0 76.2 60.5 31.4 148.8l87.8 68.2c21.5-64.3 81.8-112.2 152.8-112.2z"
                                />
                            </svg>
                            Sign in with Google
                        </button>
                        {/* OR Line Separator */}
                        <div className="flex items-center my-4">
                            <div className="flex-grow h-px bg-gray-500"></div>
                            <span className="mx-2 text-gray-400 text-sm">or</span>
                            <div className="flex-grow h-px bg-gray-500"></div>
                        </div>

                        {/* line or wali cheez */}

                        <div>
                            <label
                                htmlFor="email"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Your email
                            </label>
                            <input
                                type="email"
                                onChange={(e) => setEmail(e.target.value)}
                                name="email"
                                id="email"
                                className="outline-none border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-[#1c1d21] dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Your password
                            </label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                name="password"
                                id="password"
                                placeholder="••••••••"
                                className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-[#1c1d21] block w-full p-2.5  dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                required
                            />
                        </div>
                        <div className="flex items-start">
                            <div className="flex items-start"></div>
                            <Link
                                to="/forgot"
                                className="ms-auto text-sm text-[#8f34c2] hover:underline "
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            className="w-full text-white bg-[#8f34c2] hover:bg-[#762ba1]  cursor-pointer focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                        >
                            Login to your account
                        </button>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                            Not registered?{" "}
                            <Link
                                to="/register"
                                className=" text-[#8f34c2] hover:underline "
                            >
                                Create account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right side image */}
            <SideImg/>
        </div>
    );
};

export default Login;
