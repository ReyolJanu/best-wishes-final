import { useMemo } from "react"
import { Card, CardContent } from "../../../components/ui/card"
import { Users, UserCheck, UserX, DollarSign } from "lucide-react"

export function UsersStats({ users = [], loading = false }) {

	const { totalUsers, activeUsers, inactiveUsers, totalRevenue } = useMemo(() => {
		const total = users.length
		const active = users.filter(u => u.status === 'Active').length
		const inactive = total - active
		const revenue = users.reduce((sum, u) => sum + (u.totalBuyingAmount || 0), 0)
		return { totalUsers: total, activeUsers: active, inactiveUsers: inactive, totalRevenue: revenue }
	}, [users])

	const stats = [
		{ title: "Total Users", value: loading ? '…' : String(totalUsers), change: "", icon: Users, color: "bg-blue-500" },
		{ title: "Active Users", value: loading ? '…' : String(activeUsers), change: "", icon: UserCheck, color: "bg-green-500" },
		{ title: "Inactive Users", value: loading ? '…' : String(inactiveUsers), change: "", icon: UserX, color: "bg-red-500" },
		{ title: "Total Revenue", value: loading ? '…' : `$${totalRevenue.toFixed(2)}`, change: "", icon: DollarSign, color: "bg-purple-500" },
	]

	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<Card key={stat.title}>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">{stat.title}</p>
								<p className="text-2xl font-bold text-gray-900">{stat.value}</p>
							</div>
							<div className={`p-3 rounded-full ${stat.color}`}>
								<stat.icon className="h-5 w-5 text-white" />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
