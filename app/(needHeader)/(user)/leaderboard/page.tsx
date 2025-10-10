"use client";

import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@/app/generated/prisma";
import Image from "next/image";

interface LeaderboardEntry extends User {
  rank: number;
}

const LeaderboardPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [minCoinThreshold, setMinCoinThreshold] = useState<number | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const limit = 20; // 每页加载20个

  const fetchLeaderboard = useCallback(
    async (currentOffset: number, isRefresh: boolean = false) => {
      if (isLoading && !isRefresh) return;

      if (isRefresh) {
        setIsAutoRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      try {
        const response = await fetch(
          `/api/leaderboard?limit=${limit}&offset=${currentOffset}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          const newUsers = result.data.leaderboard.map(
            (user: User, index: number) => ({
              ...user,
              rank: currentOffset + index + 1,
            })
          );

          setUsers((prev) =>
            currentOffset === 0 ? newUsers : [...prev, ...newUsers]
          );

          if (currentOffset + newUsers.length >= result.data.total) {
            setHasMore(false);
          }
          setOffset(currentOffset + limit);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        setHasMore(false);
      } finally {
        if (isRefresh) {
          setIsAutoRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [isLoading]
  );

  // 获取上榜门槛配置
  const fetchMinCoinThreshold = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/admin/settings/dictionary/key/LEADERBOARD_MIN_COIN_THRESHOLD"
      );
      if (response.ok) {
        const result = await response.json();
        if (result.value) {
          setMinCoinThreshold(parseInt(result.value, 10));
        }
      }
    } catch (error) {
      console.error("Failed to fetch min coin threshold:", error);
    }
  }, []);

  useEffect(() => {
    fetchMinCoinThreshold();
    fetchLeaderboard(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Initial fetch only

  // 定时刷新排行榜数据
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // 只刷新第一页的数据
      fetchLeaderboard(0, true);
    }, 10000); // 10秒刷新一次

    // 清理定时器
    return () => {
      clearInterval(refreshInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchLeaderboard(offset);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.nickname) {
      return user.nickname;
    }
    if (user.email) {
      const emailPrefix = user.email.split("@")[0];
      return `神秘人${emailPrefix.slice(-4)}`;
    }
    return "神秘人";
  };

  const handleAvatarError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src =
      "https://files.authing.co/authing-console/default-user-avatar.png";
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
          <CardTitle className="text-center text-2xl font-bold text-yellow-800 dark:text-yellow-200 flex items-center justify-center gap-2">
            🏆 游戏币排行榜 🏆
            {isAutoRefreshing && (
              <div className="animate-spin text-yellow-600 dark:text-yellow-400">
                ⟳
              </div>
            )}
          </CardTitle>
          {minCoinThreshold && (
            <p className="text-center text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              拥有 {minCoinThreshold} 个游戏币以上即可上榜，快来挑战吧！
            </p>
          )}
          {!isAutoRefreshing && (
            <p className="text-center text-xs text-yellow-500 dark:text-yellow-500 mt-1 opacity-70">
              📱 每10秒自动刷新数据
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {users.length > 0 && (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-4 rounded-xl border-2 border-yellow-100 dark:border-yellow-800/30 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/10 dark:to-amber-900/10 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-12 text-center">
                    {user.rank <= 3 ? (
                      <div className="text-2xl">
                        {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                        #{user.rank}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <Image
                      src={
                        user.avatar ||
                        "https://files.authing.co/authing-console/default-user-avatar.png"
                      }
                      alt={getUserDisplayName(user)}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200 dark:border-yellow-700"
                      onError={handleAvatarError}
                    />
                  </div>
                  <div className="flex-grow ml-4">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {getUserDisplayName(user)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    <span>{user.coins}</span>
                    <span className="text-xl">💰</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading && <p className="text-center mt-4">加载中...</p>}

          {!isLoading && !hasMore && users.length > 0 && (
            <p className="text-center mt-4 text-gray-500">没有更多了</p>
          )}

          {!isLoading && !hasMore && users.length === 0 && (
            <div className="relative flex flex-col items-center justify-center text-center py-20 px-4 overflow-hidden">
              {/* 背景装饰元素 */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-8 left-8 text-6xl opacity-10 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}>🏆</div>
                <div className="absolute top-12 right-12 text-5xl opacity-15 animate-bounce" style={{animationDelay: '1s', animationDuration: '2.5s'}}>🥇</div>
                <div className="absolute bottom-16 left-16 text-4xl opacity-10 animate-bounce" style={{animationDelay: '2s', animationDuration: '3.5s'}}>🏅</div>
                <div className="absolute bottom-20 right-8 text-5xl opacity-15 animate-bounce" style={{animationDelay: '0.5s', animationDuration: '2.8s'}}>🎖️</div>
                <div className="absolute top-1/3 left-1/4 text-3xl opacity-10 animate-bounce" style={{animationDelay: '1.5s', animationDuration: '3.2s'}}>⭐</div>
                <div className="absolute top-2/3 right-1/3 text-4xl opacity-15 animate-bounce" style={{animationDelay: '2.5s', animationDuration: '2.7s'}}>💎</div>
              </div>

              {/* 主要内容 */}
              <div className="relative z-10">
                {/* 主图标区域 */}
                <div className="relative mb-8">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-yellow-900/30 dark:via-amber-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-2xl border-4 border-yellow-200/50 dark:border-yellow-700/50">
                    <Trophy className="w-16 h-16 text-yellow-600 dark:text-yellow-400 animate-pulse" strokeWidth={1.5} />
                  </div>
                  {/* 光环效果 */}
                  <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-400/20 animate-ping"></div>
                </div>

                {/* 标题区域 */}
                <div className="mb-6">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 dark:from-yellow-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-3">
                    🌟 排行榜虚位以待 🌟
                  </h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-400 mx-auto rounded-full"></div>
                </div>

                {/* 描述区域 */}
                <div className="mb-10">
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto leading-relaxed">
                    {minCoinThreshold
                      ? `💰 努力获得超过 ${minCoinThreshold} 枚游戏币，成为第一位传奇探索者！`
                      : "🗺️ 踏上冒险之旅，成为第一位登上荣耀榜单的勇者！"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    探索神秘地点，收集珍贵游戏币，让你的名字闪耀在排行榜顶端✨
                  </p>
                </div>

                {/* 激励卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-yellow-200/50 dark:border-yellow-700/50">
                    <div className="text-2xl mb-2">🎯</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">探索地点</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-700/50">
                    <div className="text-2xl mb-2">💰</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">收集游戏币</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
                    <div className="text-2xl mb-2">👑</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">登上榜首</p>
                  </div>
                </div>

                {/* 行动按钮 */}
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/map')}
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
                  >
                    🗺️ 开始探索之旅
                  </Button>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    点击开始你的冒险，发现隐藏的宝藏！
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-6">
              <Button onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? "加载中..." : "加载更多"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
