export function parseFeedReadPagination(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "12");

  if (!Number.isInteger(page) || page < 1) {
    throw new TypeError("page는 1 이상의 정수여야 합니다.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new TypeError("limit은 1 이상 50 이하의 정수여야 합니다.");
  }

  return { page, limit };
}
