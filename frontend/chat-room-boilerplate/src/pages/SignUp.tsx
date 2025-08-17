
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext-http-jwt";
import api from '../AxiosInstance';
import { useGoogleLogin } from "@react-oauth/google";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";
// import { FaSpinner } from "react-icons/fa";
import { CgSpinnerAlt } from "react-icons/cg";
import SideImg from "../components/SideImg";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .refine((val) => zxcvbn(val).score >= 2, {
      message: "Password is too weak or common. Try adding symbols, numbers, or uppercase letters."
    }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type FormFields = z.infer<typeof schema>;

const SignUp = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useContext(AuthContext)!;

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormFields>({
    resolver: zodResolver(schema)
  });

  const googleLoginButton = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      console.log(codeResponse);
      await googleLogin(codeResponse.code);
      navigate("/app");
    },
    onError: () => console.log("Google Login Failed"),
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      const response = await api.post("accounts/users/", {
        name: data.name,
        email: data.email,
        password: data.password,
        re_password: data.confirmPassword,
      });

      if (response.status === 201) {
        alert("Verification email sent. Please check your inbox to activate your account.");
        navigate("/login");
      }
    } catch (error: any) {
      // understanding this
      if (error.response?.data) {
        const serverErrors = error.response.data;
        Object.entries(serverErrors).forEach(([field, messages]) => {
          setError(field as keyof FormFields, {
            type: "server",
            message: (messages as string[]).join(" ")
          });
        });
      } else {
        alert("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="w-full flex bg-black h-[100vh]">
      <div className="w-full md:w-3/5 h-full flex items-center justify-center">
        <div className="w-full max-w-sm p-4 bg-white rounded-lg shadow-sm sm:p-6 md:p-8 dark:bg-black">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <h5 className="text-xl font-medium text-gray-900 text-center dark:text-white">
              Sign up to [platform]
            </h5>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-black bg-white border-gray-400 border-[1.5px] cursor-pointer font-medium rounded-lg text-sm px-5 py-2.5 text-center hover:bg-[#e6e6e6]"
              onClick={() => googleLoginButton()}
            >
              <svg className="w-4 h-4" viewBox="0 0 533.5 544.3">
                <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.5-34.2-4.3-50.6H272v95.8h147.1c-6.3 34-25 62.9-53.4 82.2v68h86.1c50.5-46.5 81.7-115.1 81.7-195.4z" />
                <path fill="#34a853" d="M272 544.3c72.8 0 133.8-24.1 178.4-65.3l-86.1-68c-24 16.1-54.8 25.6-92.3 25.6-71 0-131.3-47.9-152.8-112.2H31.4v70.7c44.8 88.7 137.1 149.2 240.6 149.2z" />
                <path fill="#fbbc04" d="M119.2 324.4c-10.2-30-10.2-62.4 0-92.4V161.3H31.4c-43.1 86.2-43.1 188.2 0 274.4l87.8-68.2z" />
                <path fill="#ea4335" d="M272 107.2c39.6-.6 77.8 13.6 107.1 38.9l80-80C407.5 23.6 341.3 0 272 0 168.5 0 76.2 60.5 31.4 148.8l87.8 68.2c21.5-64.3 81.8-112.2 152.8-112.2z" />
              </svg>
              Sign up with Google
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-500"></div>
              <span className="mx-2 text-gray-400 text-sm">or</span>
              <div className="flex-grow h-px bg-gray-500"></div>
            </div>

            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
              <input
                id="name"
                {...register("name")}
                className="outline-none border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-[#1c1d21] dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                placeholder="Jon Snow"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="outline-none border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-[#1c1d21] dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                placeholder="name@company.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your password</label>
              <input
                id="password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-[#1c1d21] block w-full p-2.5 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="••••••••"
                className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-[#1c1d21] block w-full p-2.5 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white bg-[#8f34c2] hover:bg-[#762ba1] cursor-pointer focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2"
            >
              Create account {isSubmitting && <CgSpinnerAlt  className="animate-spin text-xl" />}
            </button>

            <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className=" text-[#8f34c2] hover:underline ">Login</Link>
            </div>
          </form>
        </div>
      </div>

      <SideImg /> 
    </div>
    
  );
};

export default SignUp;
