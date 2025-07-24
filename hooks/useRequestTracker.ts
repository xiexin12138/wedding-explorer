import { useCallback } from 'react';
import { trackedFetch, createRequestTracker, completeRequestTracker, logRequestError } from '@/lib/request-tracker';

/**
 * 请求追踪 Hook
 * 提供带有请求追踪功能的网络请求方法
 * 
 * @example
 * ```tsx
 * import { useRequestTracker } from '@/hooks/useRequestTracker';
 * 
 * function MyComponent() {
 *   const { fetchWithTracking } = useRequestTracker();
 *   
 *   const handleSubmit = async () => {
 *     const response = await fetchWithTracking('/api/data', {
 *       method: 'POST',
 *       body: JSON.stringify({ data: 'test' })
 *     });
 *   };
 * }
 * ```
 */
export function useRequestTracker() {
  /**
   * 带追踪的 fetch 请求
   */
  const fetchWithTracking = useCallback(async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    return trackedFetch(input, init);
  }, []);

  /**
   * 带追踪的 GET 请求
   */
  const getWithTracking = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    return trackedFetch(url, {
      method: 'GET',
      ...init
    });
  }, []);

  /**
   * 带追踪的 POST 请求
   */
  const postWithTracking = useCallback(async (
    url: string, 
    body?: BodyInit, 
    init?: RequestInit
  ): Promise<Response> => {
    return trackedFetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      },
      ...init
    });
  }, []);

  /**
   * 带追踪的 PUT 请求
   */
  const putWithTracking = useCallback(async (
    url: string, 
    body?: BodyInit, 
    init?: RequestInit
  ): Promise<Response> => {
    return trackedFetch(url, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      },
      ...init
    });
  }, []);

  /**
   * 带追踪的 DELETE 请求
   */
  const deleteWithTracking = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    return trackedFetch(url, {
      method: 'DELETE',
      ...init
    });
  }, []);

  /**
   * 带追踪的 PATCH 请求
   */
  const patchWithTracking = useCallback(async (
    url: string, 
    body?: BodyInit, 
    init?: RequestInit
  ): Promise<Response> => {
    return trackedFetch(url, {
      method: 'PATCH',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      },
      ...init
    });
  }, []);

  return {
    fetchWithTracking,
    getWithTracking,
    postWithTracking,
    putWithTracking,
    deleteWithTracking,
    patchWithTracking
  };
} 