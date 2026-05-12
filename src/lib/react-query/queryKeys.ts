export enum QUERY_KEYS {
  // AUTH KEYS
  CREATE_USER_ACCOUNT = "createUserAccount",

  // USER KEYS
  GET_CURRENT_USER = "getCurrentUser",
  GET_USERS = "getUsers",
  GET_USER_BY_ID = "getUserById",

  // POST KEYS
  GET_POSTS = "getPosts",
  GET_INFINITE_POSTS = "getInfinitePosts",
  GET_RECENT_POSTS = "getRecentPosts",
  GET_POST_BY_ID = "getPostById",
  GET_USER_POSTS = "getUserPosts",
  GET_FILE_PREVIEW = "getFilePreview",
  GET_TRENDING_POSTS = "getTrendingPosts",
  GET_POSTS_BY_TAG = "getPostsByTag",

  //  SEARCH KEYS
  SEARCH_POSTS = "getSearchPosts",

  // COMMENT KEYS
  GET_POST_COMMENTS = "getPostComments",

  // USERNAME LOOKUP
  GET_USER_BY_USERNAME = "getUserByUsername",
}
