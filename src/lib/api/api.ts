import { IUpdatePost, INewPost, INewUser, IUpdateUser } from "@/types";
import { API_BASE_URL } from "./config";

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

async function apiFetchForm(path: string, body: FormData, method = "POST"): Promise<any> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

// ============================================================
// AUTH
// ============================================================

export async function createUserAccount(user: INewUser) {
  try {
    return await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    return await apiFetch("/auth/signin", {
      method: "POST",
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.log(error);
  }
}

export async function signOutAccount() {
  try {
    return await apiFetch("/auth/signout", { method: "POST" });
  } catch (error) {
    console.log(error);
  }
}

export async function getCurrentUser() {
  try {
    return await apiFetch("/auth/me");
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================================================
// POSTS
// ============================================================

export async function createPost(post: INewPost) {
  try {
    const form = new FormData();
    form.append("caption", post.caption);
    form.append("file", post.file[0]);
    if (post.location) form.append("location", post.location);
    if (post.tags) form.append("tags", post.tags);

    return await apiFetchForm("/posts", form);
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: string | null }) {
  try {
    const params = new URLSearchParams({ limit: "9" });
    if (pageParam) params.append("cursor", pageParam);
    return await apiFetch(`/posts?${params}`);
  } catch (error) {
    console.log(error);
  }
}

export async function getRecentPosts() {
  try {
    return await apiFetch("/posts/recent");
  } catch (error) {
    console.log(error);
  }
}

export async function getTrendingPosts() {
  return apiFetch("/posts/trending");
}

export async function getPostsByTag(tag: string) {
  return apiFetch(`/posts/tag/${encodeURIComponent(tag)}`);
}

export async function searchPosts(searchTerm: string) {
  try {
    return await apiFetch(`/posts/search?q=${encodeURIComponent(searchTerm)}`);
  } catch (error) {
    console.log(error);
  }
}

export async function getPostById(postId?: string) {
  if (!postId) throw new Error("postId required");
  try {
    return await apiFetch(`/posts/${postId}`);
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  try {
    const form = new FormData();
    form.append("caption", post.caption);
    form.append("location", post.location || "");
    form.append("tags", post.tags || "");
    if (post.file.length > 0) form.append("file", post.file[0]);

    return await apiFetchForm(`/posts/${post.postId}`, form, "PUT");
  } catch (error) {
    console.log(error);
  }
}

export async function deletePost(postId?: string, _imageId?: string) {
  if (!postId) return;
  try {
    return await apiFetch(`/posts/${postId}`, { method: "DELETE" });
  } catch (error) {
    console.log(error);
  }
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    return await apiFetch(`/posts/${postId}/like`, {
      method: "PATCH",
      body: JSON.stringify({ likesArray }),
    });
  } catch (error) {
    console.log(error);
  }
}

export async function savePost(userId: string, postId: string) {
  try {
    return await apiFetch("/saves", {
      method: "POST",
      body: JSON.stringify({ userId, postId }),
    });
  } catch (error) {
    console.log(error);
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    return await apiFetch(`/saves/${savedRecordId}`, { method: "DELETE" });
  } catch (error) {
    console.log(error);
  }
}

export async function getUserPosts(userId?: string) {
  if (!userId) return;
  try {
    return await apiFetch(`/users/${userId}/posts`);
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// COMMENTS
// ============================================================

export async function getPostComments(postId: string) {
  return apiFetch(`/posts/${postId}/comments`);
}

export async function createComment(postId: string, body: string) {
  return apiFetch(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function deleteComment(postId: string, commentId: string) {
  return apiFetch(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
}

// ============================================================
// USERS
// ============================================================

export async function getUsers(limit?: number, q?: string) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (q) params.append("q", q);
    const qs = params.toString();
    return await apiFetch(`/users${qs ? `?${qs}` : ""}`);
  } catch (error) {
    console.log(error);
  }
}

export async function getUserById(userId: string) {
  return apiFetch(`/users/${userId}`);
}

export async function getUserByUsername(username: string) {
  return apiFetch(`/users/u/${encodeURIComponent(username)}`);
}

export async function followUser(userId: string) {
  return apiFetch(`/users/${userId}/follow`, { method: "POST" });
}

export async function unfollowUser(userId: string) {
  return apiFetch(`/users/${userId}/follow`, { method: "DELETE" });
}

export async function updateUser(user: IUpdateUser) {
  try {
    const form = new FormData();
    form.append("name", user.name);
    form.append("bio", user.bio);
    form.append("isPrivate", String(user.isPrivate ?? false));
    if (user.file.length > 0) form.append("file", user.file[0]);

    return await apiFetchForm(`/users/${user.userId}`, form, "PUT");
  } catch (error) {
    console.log(error);
  }
}
