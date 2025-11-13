import { useQuery } from "@tanstack/react-query";



export default function Portfolio(){
      
    try{
        const {data: portfolios, isLoading } = useQuery({
        queryKey: ["portfolios", userId],
        queryFn: () => getUserPortfolios(userId),
    });
    }
}
