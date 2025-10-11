"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Loader2,
  Receipt,
  Calendar,
} from "lucide-react";
import type { CoinTransaction, TransactionType } from "@/app/generated/prisma";

// 交易类型的中文映射
const TRANSACTION_TYPE_MAP: Record<TransactionType, string> = {
  EARN: "获得",
  SPEND: "消费",
  ADMIN_ADD: "管理员增加",
  ADMIN_SUB: "管理员扣除",
  REFUND: "退款",
  SYSTEM: "系统",
};

// 交易类型的颜色映射
const TRANSACTION_TYPE_COLOR: Record<
  TransactionType,
  { bg: string; text: string; icon: string }
> = {
  EARN: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-500",
  },
  SPEND: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    icon: "text-red-600 dark:text-red-500",
  },
  ADMIN_ADD: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-500",
  },
  ADMIN_SUB: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    icon: "text-orange-600 dark:text-orange-500",
  },
  REFUND: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-400",
    icon: "text-purple-600 dark:text-purple-500",
  },
  SYSTEM: {
    bg: "bg-gray-50 dark:bg-gray-950/30",
    text: "text-gray-700 dark:text-gray-400",
    icon: "text-gray-600 dark:text-gray-500",
  },
};

interface TransactionWithPagination {
  transactions: CoinTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CoinHistoryPage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<"all" | TransactionType>(
    "all"
  );
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    currentBalance: 0,
  });

  const pageSize = 20;

  // 获取交易记录
  const fetchTransactions = useCallback(
    async (pageNum: number, typeFilter: "all" | TransactionType) => {
      if (!user?.data?.dbId) return;

      setLoading(true);
      try {
        const url = new URL("/api/user/transactions", window.location.origin);
        url.searchParams.set("userId", String(user.data.dbId));
        url.searchParams.set("page", pageNum.toString());
        url.searchParams.set("pageSize", pageSize.toString());
        if (typeFilter !== "all") {
          url.searchParams.set("type", typeFilter);
        }

        const response = await fetch(url.toString());
        const result = await response.json();

        if (result.success && result.data) {
          const data = result.data as TransactionWithPagination;
          if (pageNum === 1) {
            setTransactions(data.transactions);
          } else {
            setTransactions((prev) => [...prev, ...data.transactions]);
          }
          setHasMore(pageNum < data.totalPages);
        }
      } catch (error) {
        console.error("获取交易记录失败:", error);
      } finally {
        setLoading(false);
      }
    },
    [user?.data?.dbId]
  );

  // 获取用户统计信息
  const fetchUserStats = useCallback(async () => {
    if (!user?.data?.dbId) return;

    try {
      const response = await fetch("/api/user/profile");
      const result = await response.json();

      if (result.success && result.data) {
        const userData = result.data.user;
        setStats({
          totalEarned: userData.totalCoinsEarned || 0,
          totalSpent: userData.totalCoinsSpent || 0,
          currentBalance: userData.coins || 0,
        });
      }
    } catch (error) {
      console.error("获取用户统计信息失败:", error);
    }
  }, [user?.data?.dbId]);

  // 初始加载
  useEffect(() => {
    if (user?.data?.dbId) {
      fetchUserStats();
      fetchTransactions(1, selectedType);
    }
  }, [user?.data?.dbId, fetchUserStats, fetchTransactions, selectedType]);

  // 切换筛选类型
  const handleTypeChange = (type: string) => {
    const newType = type as "all" | TransactionType;
    setSelectedType(newType);
    setPage(1);
    setTransactions([]);
    fetchTransactions(1, newType);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, selectedType);
    }
  };

  // 格式化日期
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `今天 ${d.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (days === 1) {
      return `昨天 ${d.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return d.toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (userLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-500">
          <Receipt className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            游戏币明细
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            查看您的游戏币收支记录
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              累计收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{stats.totalEarned.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              历史累计获得
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              累计支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{stats.totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              历史累计消费
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-300 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              当前余额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-500">
              {stats.currentBalance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              可用游戏币
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 交易记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            交易记录
          </CardTitle>
          <CardDescription>查看所有游戏币变动详情</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选标签 */}
          <Tabs value={selectedType} onValueChange={handleTypeChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="EARN">收入</TabsTrigger>
              <TabsTrigger value="SPEND">支出</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="mt-4 space-y-3">
              {loading && transactions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    加载中...
                  </span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                    <Receipt className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    暂无记录
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedType === "all"
                      ? "您还没有任何游戏币交易记录"
                      : selectedType === "EARN"
                      ? "您还没有收入记录"
                      : "您还没有支出记录"}
                  </p>
                </div>
              ) : (
                <>
                  {transactions.map((transaction) => {
                    const typeInfo =
                      TRANSACTION_TYPE_COLOR[transaction.type];
                    const isPositive = transaction.amount > 0;
                    return (
                      <div
                        key={transaction.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${typeInfo.bg} border-opacity-50 transition-all hover:shadow-md`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full ${typeInfo.bg} flex items-center justify-center`}
                          >
                            {isPositive ? (
                              <TrendingUp
                                className={`h-5 w-5 ${typeInfo.icon}`}
                              />
                            ) : (
                              <TrendingDown
                                className={`h-5 w-5 ${typeInfo.icon}`}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span
                                className={`px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.text} font-medium`}
                              >
                                {TRANSACTION_TYPE_MAP[transaction.type]}
                              </span>
                              <span>•</span>
                              <span>{formatDate(transaction.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-4">
                          <p
                            className={`text-lg font-bold ${
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            余额: {transaction.balanceAfter.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* 加载更多按钮 */}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loading}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            加载中...
                          </>
                        ) : (
                          "加载更多"
                        )}
                      </Button>
                    </div>
                  )}

                  {!hasMore && transactions.length > 0 && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
                      已显示全部记录
                    </p>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

