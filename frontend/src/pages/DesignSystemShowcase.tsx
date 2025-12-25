// React import removed as unused
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card';

export default function DesignSystemShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground">Core components and style guide.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid gap-4 max-w-sm">
          <Input type="email" placeholder="Email address" />
          <Input type="password" placeholder="Password" />
          <Input disabled type="email" placeholder="Disabled input" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content. This is a basic card component.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Action</Button>
            </CardFooter>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Enter credentials to access account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               <Input placeholder="Username" />
               <Input type="password" placeholder="Password" />
            </CardContent>
            <CardFooter>
              <Button className="w-full">Sign In</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
