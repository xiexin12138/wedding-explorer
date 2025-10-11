"use client";

import { Trophy, Users, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@/app/generated/prisma";

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
  const [totalUsers, setTotalUsers] = useState<number>(0); // 总用户数
  const [totalOnLeaderboard, setTotalOnLeaderboard] = useState<number>(0); // 上榜人数
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

          // 更新总数信息
          setTotalOnLeaderboard(result.data.total);
          setTotalUsers(result.data.totalUsers);

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

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-2 border-yellow-400 dark:border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-lg hover:shadow-xl';
      case 2:
        return 'border-2 border-gray-400 dark:border-gray-500 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 shadow-lg hover:shadow-xl';
      case 3:
        return 'border-2 border-orange-400 dark:border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 shadow-lg hover:shadow-xl';
      default:
        return 'border-amber-200 dark:border-amber-800/30 hover:shadow-md hover:scale-[1.01]';
    }
  };

  // 获取卡片背景样式
  const getCardBackground = (rank: number) => {
    if (rank <= 3) {
      return ''; // 前三名使用 getRankStyle 中的渐变
    }
    return 'dark:bg-amber-900/10'; // 其他名次使用指定颜色
  };

  // 获取排名标识样式
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl  bg-amber-50 dark:bg-amber-900/10">
      <Card className="shadow-lg">
        <CardHeader className=" dark:from-amber-900/20 dark:to-orange-900/20">
          <CardTitle className="text-center text-2xl font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
            🏆 游戏币排行榜 🏆
            {isAutoRefreshing && (
              <div className="animate-spin text-amber-700 dark:text-amber-500">
                ⟳
              </div>
            )}
          </CardTitle>
          
          {/* 统计信息区域 */}
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold text-amber-700 dark:text-amber-500">{totalOnLeaderboard}</span> 人上榜
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                共 <span className="font-bold text-amber-700 dark:text-amber-500">{totalUsers}</span> 位参与者
              </span>
            </div>
          </div>

          {minCoinThreshold && (
            <p className="text-center text-sm text-amber-700 dark:text-amber-400 mt-3">
              拥有 {minCoinThreshold} 个游戏币以上即可上榜，快来挑战吧！
            </p>
          )}
          {!isAutoRefreshing && (
            <p className="text-center text-xs text-amber-600 dark:text-amber-500 mt-1 opacity-80">
              📱 每10秒自动刷新数据
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {users.length > 0 && (
            <div className="space-y-3">
              {users.map((user) => {
                // 为前三名设置不同的样式，去掉动画
                const isTopThree = user.rank <= 3;
                
                return (
                  <div
                    key={user.id}
                    className={`
                      flex items-center p-4 rounded-xl border transition-all duration-200
                      ${isTopThree 
                        ? getRankStyle(user.rank) 
                        : `${getRankStyle(user.rank)} ${getCardBackground(user.rank)}`
                      }
                    `}
                  >
                    {/* 排名显示 */}
                    <div className="w-10 text-center">
                      {user.rank <= 3 ? (
                        <div className="text-2xl">
                          {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          #{user.rank}
                        </div>
                      )}
                    </div>

                    {/* 用户名和排名标识 */}
                    <div className="flex-grow ml-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`truncate ${
                          isTopThree 
                            ? 'text-gray-900 dark:text-gray-100 text-lg' 
                            : 'text-gray-800 dark:text-gray-200'
                        }`} title={getUserDisplayName(user)}>
                          {getUserDisplayName(user)}
                        </div>
                        {/* 前三名标识 */}
                        {isTopThree && (
                          <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                            getRankBadge(user.rank)
                          }`}>
                            {user.rank === 1 ? '冠军' : user.rank === 2 ? '亚军' : '季军'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 游戏币数量 */}
                    <div className={`flex-shrink-0 flex items-center gap-2 font-bold ${
                      isTopThree 
                        ? 'text-xl text-amber-700 dark:text-amber-400' 
                        : 'text-lg text-amber-700 dark:text-amber-500'
                    }`}>
                      <span className="tabular-nums">{user.coins}</span>
                      <span className={isTopThree ? 'text-2xl' : 'text-xl'}>💰</span>
                    </div>
                  </div>
                );
              })}
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
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-100 via-orange-100 to-amber-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-amber-900/30 flex items-center justify-center shadow-2xl border-4 border-amber-300/50 dark:border-amber-700/50">
                    <Trophy className="w-16 h-16 text-amber-700 dark:text-amber-500 animate-pulse" strokeWidth={1.5} />
                  </div>
                  {/* 光环效果 */}
                  <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 animate-ping"></div>
                </div>

                {/* 标题区域 */}
                <div className="mb-6">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 dark:from-amber-500 dark:via-orange-500 dark:to-amber-500 bg-clip-text text-transparent mb-3">
                    🌟 排行榜虚位以待 🌟
                  </h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-amber-600 to-orange-600 mx-auto rounded-full"></div>
                </div>

                {/* 描述区域 */}
                <div className="mb-10">
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto leading-relaxed">
                    {minCoinThreshold
                      ? `💰 努力获得超过 ${minCoinThreshold} 枚游戏币，成为第一位传奇参与者！`
                      : "🗺️ 踏上冒险之旅，成为第一位登上荣耀榜单的勇者！"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    探索神秘地点，收集珍贵游戏币，让你的名字闪耀在排行榜顶端✨
                  </p>
                </div>

                {/* 激励卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-300/50 dark:border-amber-700/50">
                    <div className="text-2xl mb-2">🎯</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">探索地点</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-300/50 dark:border-orange-700/50">
                    <div className="text-2xl mb-2">💰</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">收集游戏币</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-300/50 dark:border-orange-700/50">
                    <div className="text-2xl mb-2">👑</div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">登上榜首</p>
                  </div>
                </div>

                {/* 行动按钮 */}
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/map')}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
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
