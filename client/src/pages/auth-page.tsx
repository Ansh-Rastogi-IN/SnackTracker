import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";

const loginSchema = z.object({
  username: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      isAdmin: false,
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);


  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-poppins font-bold text-primary mb-2">SnackTrack</h1>
            <p className="text-neutral-400">Your smart digital canteen management system</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        {...loginForm.register("username")} 
                        placeholder="your@email.com" 
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        {...loginForm.register("password")}
                        placeholder="••••••••" 
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" {...loginForm.register("rememberMe")} />
                        <Label htmlFor="remember" className="text-sm">Remember me</Label>
                      </div>
                      <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-orange-600" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          {...registerForm.register("firstName")}
                          placeholder="John" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          {...registerForm.register("lastName")}
                          placeholder="Doe" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regEmail">Email</Label>
                      <Input 
                        id="regEmail" 
                        type="email" 
                        {...registerForm.register("username")}
                        placeholder="your@email.com" 
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <Input 
                        id="regPassword" 
                        type="password" 
                        {...registerForm.register("password")}
                        placeholder="••••••••" 
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        {...registerForm.register("confirmPassword")}
                        placeholder="••••••••" 
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-orange-600"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Register"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center">
        <div className="max-w-md text-center p-8">
          <h2 className="text-4xl font-poppins font-bold text-white mb-6">Welcome to SnackTrack</h2>
          <p className="text-white/90 mb-8 text-lg">
            Your smart digital canteen management system. Order food, track your orders, and enjoy a seamless dining experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-restaurant-line text-xl text-white"></i>
              </div>
              <h3 className="text-white font-medium mb-1">Browse Menu</h3>
              <p className="text-white/80 text-sm">Explore delicious food items</p>
            </div>

            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-time-line text-xl text-white"></i>
              </div>
              <h3 className="text-white font-medium mb-1">Save Time</h3>
              <p className="text-white/80 text-sm">Pre-order your meals</p>
            </div>

            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-wallet-3-line text-xl text-white"></i>
              </div>
              <h3 className="text-white font-medium mb-1">Easy Payment</h3>
              <p className="text-white/80 text-sm">Cashless transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}