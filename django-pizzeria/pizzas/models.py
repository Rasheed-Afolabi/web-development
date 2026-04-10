from django.db import models
class Pizza(models.Model):
    pizza_name = models.CharField(max_length=100)
    pizza_image = models.ImageField(upload_to='pizza_images/', null=True, blank=True)
    def __str__(self):
        return self.pizza_name
class Topping(models.Model):
    pizza = models.ForeignKey(Pizza, on_delete=models.CASCADE, related_name='toppings')
    topping_name = models.CharField(max_length=100)
    def __str__(self):
        return f"{self.topping_name} ({self.pizza.pizza_name})"
class Comment(models.Model):
    pizza = models.ForeignKey(Pizza, on_delete=models.CASCADE, related_name='comments')
    name = models.CharField(max_length=50)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
