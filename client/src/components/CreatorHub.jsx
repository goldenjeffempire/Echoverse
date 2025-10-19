import { motion } from "framer-motion";
import { Star, TrendingUp, Users, Award, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
const creators = [
    {
        name: "Sarah Martinez",
        role: "E-commerce Entrepreneur",
        avatar: "SM",
        achievement: "$500K in Revenue",
        story: "Went from zero to $500K in annual revenue within 8 months using EchoVerse. The AI builder helped me launch my store in days, not months.",
        metric: "300% Growth",
        color: "from-pink-500 to-rose-500"
    },
    {
        name: "James Chen",
        role: "SaaS Founder",
        avatar: "JC",
        achievement: "10K Active Users",
        story: "Built and scaled my SaaS platform to 10,000 active users. The AI automation saved me thousands in development costs.",
        metric: "10K Users",
        color: "from-blue-500 to-cyan-500"
    },
    {
        name: "Maria Rodriguez",
        role: "Content Creator",
        avatar: "MR",
        achievement: "1M Monthly Visitors",
        story: "My blog went from 0 to 1 million monthly visitors. The AI content tools and SEO features were game-changing.",
        metric: "1M Visitors",
        color: "from-purple-500 to-pink-500"
    }
];
const communityStats = [
    { icon: Users, value: "50K+", label: "Active Creators" },
    { icon: Star, value: "4.9/5", label: "Average Rating" },
    { icon: TrendingUp, value: "$100M+", label: "Revenue Generated" },
    { icon: Award, value: "500+", label: "Success Stories" }
];
export function CreatorHub() {
    return (<section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 relative overflow-hidden" data-testid="section-creator-hub">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"/>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"/>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2">
            <Award className="w-4 h-4 mr-2"/>
            Creator Success Stories
          </Badge>
          <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
            Join Thousands of Successful Creators
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Real stories from real people building incredible businesses with EchoVerse
          </p>
        </motion.div>

        {/* Community Stats */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {communityStats.map((stat, index) => {
            const Icon = stat.icon;
            return (<motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.05, y: -5 }} data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <Card className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <Icon className="w-10 h-10 mx-auto mb-3 text-purple-600 dark:text-purple-400"/>
                    <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>);
        })}
        </motion.div>

        {/* Creator Stories */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {creators.map((creator, index) => (<motion.div key={index} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.2 }} whileHover={{ y: -10 }} data-testid={`card-creator-${creator.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <Card className="relative overflow-hidden h-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-2xl transition-shadow duration-500">
                {/* Top Gradient Bar */}
                <div className={`h-2 bg-gradient-to-r ${creator.color}`}/>
                
                <CardContent className="p-8">
                  {/* Quote Icon */}
                  <Quote className="w-12 h-12 text-purple-200 dark:text-purple-800 mb-4"/>
                  
                  {/* Story */}
                  <p className="text-slate-700 dark:text-slate-200 mb-6 leading-relaxed italic">
                    "{creator.story}"
                  </p>

                  {/* Creator Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16 border-2 border-purple-500">
                      <AvatarFallback className={`bg-gradient-to-br ${creator.color} text-white font-bold text-lg`}>
                        {creator.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-lg text-slate-900 dark:text-white">
                        {creator.name}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {creator.role}
                      </div>
                    </div>
                  </div>

                  {/* Achievement Badge */}
                  <div className="flex items-center justify-between gap-4">
                    <Badge className={`bg-gradient-to-r ${creator.color} text-white`}>
                      <Award className="w-3 h-3 mr-1"/>
                      {creator.achievement}
                    </Badge>
                    <div className={`text-2xl font-black bg-gradient-to-r ${creator.color} bg-clip-text text-transparent`}>
                      {creator.metric}
                    </div>
                  </div>
                </CardContent>

                {/* Bottom Shimmer Effect */}
                <motion.div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${creator.color}`} initial={{ x: "-100%" }} whileHover={{ x: "100%" }} transition={{ duration: 0.6 }}/>
              </Card>
            </motion.div>))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
            Ready to write your own success story?
          </p>
          <motion.button className="px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-full text-lg shadow-2xl" whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(139, 92, 246, 0.5)" }} whileTap={{ scale: 0.95 }} data-testid="button-join-creators">
            Join the Creator Community
          </motion.button>
        </motion.div>
      </div>
    </section>);
}
