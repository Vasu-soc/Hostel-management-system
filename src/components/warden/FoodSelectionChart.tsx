import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Utensils, Users, PieChart as PieChartIcon, Table as TableIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function FoodSelectionChart() {
    const { toast } = useToast();
    const [data, setData] = useState<{ name: string; count: number }[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFoodSelections();
    }, []);

    const handleRemoveData = async () => {
        if (!confirm("Are you sure you want to clear all food selection data? This cannot be undone.")) return;

        try {
            const { error } = await supabase.from('food_selections').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw error;

            toast({
                title: "Data Cleared",
                description: "All food selection data has been removed successfully.",
            });
            setData([]);
            setTotalCount(0);
        } catch (error) {
            console.error("Failed to clear food selections:", error);
            toast({
                title: "Error",
                description: "Failed to clear data.",
                variant: "destructive"
            });
        }
    };

    const fetchFoodSelections = async () => {
        setIsLoading(true);
        try {
            const { data: selections, error } = await supabase.from('food_selections').select('*');
            if (error) throw error;

            if (selections) {
                // Count frequencies
                const counts: Record<string, number> = {};
                let total = 0;
                selections.forEach((sel: any) => {
                    const item = sel.food_item;
                    if (item) {
                        counts[item] = (counts[item] || 0) + 1;
                        total++;
                    }
                });

                // Convert to array and sort by count descending
                const chartData = Object.entries(counts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);

                setData(chartData);
                setTotalCount(total);
            }
        } catch (error) {
            console.error("Failed to fetch food selections:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="w-full h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="w-full border-2 border-border shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-fade-in">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Utensils className="w-6 h-6 text-primary" />
                                Food Selection Analytics
                            </CardTitle>
                            <CardDescription className="text-base">
                                Visual representation of student food preferences
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <span className="font-bold text-primary">{totalCount}</span>
                                <span className="text-sm text-primary/70">Total Students</span>
                            </div>
                            {data.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleRemoveData}
                                    className="rounded-xl flex items-center gap-2 h-10 px-4"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove Data
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/10 rounded-2xl border-2 border-dashed border-border/50">
                            <Utensils className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-lg">No food selections recorded yet.</p>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto pb-4 h-[400px]">
                            <div className="min-w-[600px] h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 60,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 500 }}
                                            axisLine={{ stroke: '#e5e7eb' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: 'currentColor', fontSize: 12 }}
                                            axisLine={{ stroke: '#e5e7eb' }}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid rgba(229, 231, 235, 1)',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                padding: '12px'
                                            }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={50}
                                        >
                                            {data.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    fillOpacity={0.8}
                                                    className="transition-all duration-300 hover:fill-opacity-100"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {data.length > 0 && (
                <Card className="w-full border-2 border-border shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-fade-in [animation-delay:200ms]">
                    <CardHeader className="border-b border-border/50 bg-muted/30">
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <TableIcon className="w-5 h-5 text-primary" />
                            Detailed Selection Counts
                        </CardTitle>
                        <CardDescription>
                            Exact breakdown of student choices per item
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px] pl-6 h-12 font-bold text-foreground">Rank</TableHead>
                                    <TableHead className="h-12 font-bold text-foreground">Food Item</TableHead>
                                    <TableHead className="text-right pr-6 h-12 font-bold text-foreground">Total Students</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item, index) => (
                                    <TableRow key={item.name} className="hover:bg-primary/5 transition-colors">
                                        <TableCell className="pl-6 py-4 font-medium">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border border-border">
                                                {index + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 font-semibold text-foreground">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                {item.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 py-4">
                                            <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold min-w-[3rem]">
                                                {item.count}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-6 bg-muted/30 border-t border-border/50 flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Selection Total</p>
                            <p className="text-2xl font-black text-primary">
                                {totalCount} <span className="text-sm font-normal text-muted-foreground">Responses</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

