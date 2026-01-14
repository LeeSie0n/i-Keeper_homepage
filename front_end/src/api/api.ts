// ==============================
// api.ts (공통 API 유틸)
// ==============================
//
// - 백엔드 응답 스키마에 맞춘 fetch 래퍼와 카테고리 ID 조회 유틸.
// - 필요 시 Base URL만 여기서 교체하면 전체가 반영됨.
//

export const BASE_URL = import.meta.env.VITE_BACKEND_URL; // 프록시 사용 중이면 그대로 두세요.

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const safeInit: RequestInit = init ?? {};
  const res = await fetch(input, {
    ...safeInit,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...(safeInit.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = "요청 실패";
    try {
      const err = await res.json();
      msg = err.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// 카테고리 이름 → ID 조회
export async function getCategoryIdByName(
  name: string
): Promise<number | null> {
  const list = await jsonFetch<any[]>(`${BASE_URL}/api/categories`);
  const found = list.find((c) => c.name?.toLowerCase() === name.toLowerCase());
  return found?.id ?? null;
}

// 게시글 목록 조회 (카테고리 선택적)
export async function fetchPostsPaged(params: {
  page: number;
  limit: number;
  categoryName?: string;
}) {
  const { page, limit, categoryName } = params;
  let url = `${BASE_URL}/api/posts?page=${page}&limit=${limit}`;

  if (categoryName) {
    const catId = await getCategoryIdByName(categoryName);
    if (catId) url += `&categoryId=${catId}`;
  }
  // 응답: { posts: [...], pagination: {...} }
  return jsonFetch<{
    posts: any[];
    pagination?: {
      totalPages?: number;
      total?: number;
      page?: number;
      limit?: number;
    };
  }>(url);
}

// 일정 목록 조회
export async function fetchEventsPaged(params?: {
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  return jsonFetch<{ events: any[]; pagination?: any }>(
    `${BASE_URL}/api/events?page=${page}&limit=${limit}`
  );
}

export async function loginApi(email: string, password: string) {
  return jsonFetch<{ message: string; user: any; accessToken: string }>(
    `${BASE_URL}/api/auth/login`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function requestPasswordReset(email: string) {
  return jsonFetch<{ message: string }>(
    `${BASE_URL}/api/auth/비번찾기 주소가 뭐야?`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );
}
 
export async function resetPasswordApi(
  token: string,
  newPassword: string
) {
  /* 비밀번호 재설정 API 주소가 뭐야? */
  return jsonFetch<{ message: string }>(
    `${BASE_URL}/api/user/me/password`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        newPassword,
      }),
    }
  );
}

export async function registerApi(payload: {
  email: string;
  password: string;
  name: string;
  major: string;
  studentId: string,
  class: string; // 예: "3/5"
}) {
  return jsonFetch<{ message: string; user: any }>(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
