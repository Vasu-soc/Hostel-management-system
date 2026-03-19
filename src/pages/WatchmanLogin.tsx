import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setWatchmanSession } from "@/lib/session";
import CollegeHeader from "@/components/CollegeHeader";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";

const WatchmanLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await (supabase as any)
                .from("watchmen")
                .select("*")
                .eq("username", formData.username)
                .eq("password", formData.password)
                .single();

            if (error || !data) {
                toast({
                    title: "Login Failed",
                    description: "Invalid username or password",
                    variant: "destructive",
                });
            } else {
                setWatchmanSession(data);
                toast({ title: "Welcome back!", description: `Logged in as ${data.name}` });
                navigate("/watchman-dashboard");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center">
            <CollegeHeader />
            <div className="flex-1 flex items-center justify-center p-4 w-full max-w-md">
                <Card className="w-full border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                    <div className="bg-primary p-8 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">Watchman Console</h1>
                        <p className="text-primary-foreground/70 text-sm mt-1 uppercase tracking-widest font-bold">Gate Security Access</p>
                    </div>

                    <CardContent className="p-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Enter watchman username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Login to Scanner"}
                            </Button>
                        </form>

                        <Button 
                            variant="ghost" 
                            className="w-full mt-6 text-neutral-400"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default WatchmanLogin;
