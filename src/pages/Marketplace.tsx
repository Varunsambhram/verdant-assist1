import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MapPin, Star, ShoppingCart, Truck, Shield } from 'lucide-react';

const Marketplace = () => {
const products: any[] = [];

  const categories = [
    'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Herbs'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Farm-to-Fresh Marketplace
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect directly with local farmers. Buy fresh, organic produce 
              while supporting farming communities with fair pricing.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search for fresh produce..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Products Grid */}
            <div className="lg:col-span-3">
<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.length === 0 ? (
                  <Card className="p-8 col-span-full text-center">
                    <h3 className="text-lg font-semibold mb-2">No products available</h3>
                    <p className="text-sm text-muted-foreground">Connect a backend marketplace API to see real listings.</p>
                  </Card>
                ) : (
                  products.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-medium transition-all duration-300 group">
                      {/* ... keep existing code */}
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Why Choose Us */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Why Shop Here?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-success mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Direct from Farm</div>
                      <div className="text-sm text-muted-foreground">No middlemen, fair prices</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Truck className="w-5 h-5 text-accent mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Fresh Delivery</div>
                      <div className="text-sm text-muted-foreground">Same day delivery available</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Star className="w-5 h-5 text-warning mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Quality Assured</div>
                      <div className="text-sm text-muted-foreground">Verified organic certification</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Farmer Spotlight */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Farmer Spotlight
                </h3>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary-foreground font-bold text-lg">RK</span>
                  </div>
                  <div className="font-medium text-foreground">Rajesh Kumar</div>
                  <div className="text-sm text-muted-foreground mb-3">Organic Farmer</div>
                  <div className="text-sm text-muted-foreground">
                    "Growing chemical-free vegetables for 15 years. Quality is my priority."
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    View Profile
                  </Button>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Marketplace Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Farmers</span>
                    <span className="font-semibold">2,500+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Products Listed</span>
                    <span className="font-semibold">15,000+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Happy Customers</span>
                    <span className="font-semibold">50,000+</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;