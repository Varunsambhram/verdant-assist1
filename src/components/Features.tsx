import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Scan, Mic, ShoppingCart, Gauge, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import diseaseDetectionImage from '@/assets/disease-detection.jpg';
import iotIrrigationImage from '@/assets/iot-irrigation.jpg';
import marketplaceImage from '@/assets/marketplace.jpg';

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Scan,
      title: 'AI Disease Detection',
      description: 'Instantly identify crop diseases using advanced AI models. Get treatment recommendations in real-time.',
      image: diseaseDetectionImage,
      benefits: ['95% accuracy rate', 'Instant diagnosis', 'Treatment guidance', 'Prevention tips'],
      color: 'from-success to-primary',
      route: '/disease-detection',
    },
    {
      icon: Mic,
      title: 'Multilingual Voice Assistant',
      description: 'Ask farming questions in your local language. Get expert advice through voice interactions.',
      image: null,
      benefits: ['10+ languages', 'Voice-to-voice', 'Expert knowledge', 'Hands-free operation'],
      color: 'from-accent to-info',
      route: '/voice-assistant',
    },
    {
      icon: ShoppingCart,
      title: 'Farm-to-Fresh Marketplace',
      description: 'Connect directly with consumers. Sell your produce at better prices with zero middlemen.',
      image: marketplaceImage,
      benefits: ['Direct sales', 'Better margins', 'Consumer reviews', 'Easy logistics'],
      color: 'from-warning to-success',
      route: '/marketplace',
    },
    {
      icon: Gauge,
      title: 'Smart IoT Monitoring',
      description: 'Monitor soil moisture, temperature, and automate irrigation with IoT sensors.',
      image: iotIrrigationImage,
      benefits: ['Real-time data', 'Auto irrigation', '30% water savings', 'Remote monitoring'],
      color: 'from-primary to-accent',
      route: '/iot-dashboard',
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Complete Agricultural{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Technology Suite
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Four powerful tools working together to transform your farming operations. 
            From AI-powered diagnostics to smart irrigation systems.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="overflow-hidden group hover:shadow-strong transition-all duration-300 cursor-pointer"
              onClick={() => navigate(feature.route)}
            >
              <div className="p-0">
                {/* Feature Image */}
                {feature.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  </div>
                )}
                
                {/* Feature Content */}
                <div className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-center mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl mr-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Benefits */}
                  <div className="grid grid-cols-2 gap-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                        <span className="text-sm text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Integration Message */}
        <div className="bg-gradient-primary rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-primary-foreground mb-4">
            All Features Work Together Seamlessly
          </h3>
          <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
            Our integrated platform ensures all your agricultural data flows between modules, 
            providing comprehensive insights and automated decision-making.
          </p>
          <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90">
            See Integration Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;