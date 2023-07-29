import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  GanttChartSquare,
  Heart,
  Image,
  Loader2,
  Lock,
  LogOut,
  MenuSquare,
  MessageCircle,
  Minus,
  Plus,
  Search,
  SmilePlus,
  Tag,
  Trash2,
  User2,
  X,
  ArrowUpDown,
  GitPullRequestDraft,
  type LucideProps,
} from 'lucide-react'

export const Icons = {
  Spinner: Loader2,
  User: User2,
  Lock,
  LogOut,
  Plus,
  Minus,
  Edit: Edit2,
  Trash: Trash2,
  X,
  Image,
  Check,
  Menu: MenuSquare,
  Search,
  Copy,
  Tag,
  CircleDollar: CircleDollarSign,
  ExternalLink,
  SmilePlus,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Heart,
  Eye,
  GanttChartSquare,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  GitPullRequestDraft,
  Google: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      ></path>
    </svg>
  ),
}
