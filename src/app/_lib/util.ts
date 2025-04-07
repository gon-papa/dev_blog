
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return format(date, "PPP", { locale: ja })
}

