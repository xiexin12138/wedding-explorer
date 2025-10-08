"use client";

import { MapExplorer } from "@/components/MapExplorer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SPECIAL_ROUTES } from "@/lib/routes.config";

export default function MapPage() {
  const router = useRouter();

  // 设置页面标题
  useEffect(() => {
    document.title = "地图探索 - Xie & Feng Wedding";
  }, []);

  const handleBackToHome = () => {
    // 使用 router.push 进行客户端路由跳转，并强制刷新
    router.push(SPECIAL_ROUTES.DEFAULT_HOME);
    // 强制刷新路由缓存
    router.refresh();
  };

  return (
    <div className="w-full h-screen relative">
      {/* 返回按钮 */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToHome}
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Button>
      </div>
      <MapExplorer />
    </div>
  );
}