import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Users, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-farming.jpg';

const Hero = () => {
  const stats = [
    { icon: Users, value: '10K+', label: 'Farmers Connected' },
    { icon: TrendingUp, value: '25%', label: 'Yield Increase' },
    { icon: Shield, value: '95%', label: 'Disease Detection Accuracy' },
    { icon: Zap, value: '30%', label: 'Water Savings' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Smart Agriculture Technology"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-left">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-6">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Smart Agriculture
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Revolutionize Your{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Farming
              </span>{' '}
              with AI
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Complete agricultural platform combining AI disease detection, 
              smart irrigation, multilingual voice assistance, and direct marketplace access.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="hero" size="xl" className="group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline-primary" size="xl">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mr-2">
                      <stat.icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Visual Elements */}
          <div className="relative lg:flex justify-center items-center hidden">
            <div className="relative">
              {/* Floating Cards */}
              <div className="absolute -top-10 -left-10 bg-card border border-border rounded-xl p-4 shadow-medium animate-float">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span className="text-sm font-medium">Disease Detected</span>
                </div>
              </div>
              
              <div className="absolute -bottom-10 -right-10 bg-card border border-border rounded-xl p-4 shadow-medium animate-float" style={{animationDelay: '1s'}}>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="text-sm font-medium">Irrigation Active</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-20 bg-card border border-border rounded-xl p-4 shadow-medium animate-float" style={{animationDelay: '2s'}}>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span className="text-sm font-medium">Weather Alert</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;