from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),                          # Homepage: /
    path('pizzas/', views.pizza_list, name='pizza_list'),       # Pizza list: /pizzas/
    path('pizzas/<int:pizza_id>/', views.pizza_detail, name='pizza_detail'),  # Pizza detail: /pizzas/1/
]



