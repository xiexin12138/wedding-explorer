import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardButton } from "@/components/DashboardButton";

export default function HomePage() {
  return (
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">
          欢迎来到 Wedding Explorer
        </CardTitle>
        <CardDescription className="text-lg">
          您的探索之旅即将开始
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          感谢您与我们一起创造美好的回忆。
        </p>
        <DashboardButton />
      </CardContent>
    </Card>
  );
}
