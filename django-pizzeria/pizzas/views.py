from django.shortcuts import render, get_object_or_404, redirect
from .models import Pizza, Comment
from .forms import CommentForm

def home(request):
    return render(request, 'pizzas/home.html')

def pizza_list(request):
    pizzas = Pizza.objects.all()
    return render(request, 'pizzas/pizza_list.html', {'pizzas': pizzas})

def pizza_detail(request, pizza_id):
    pizza = get_object_or_404(Pizza, pk=pizza_id)
    comments = Comment.objects.filter(pizza=pizza)

    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.pizza = pizza
            comment.save()
            return redirect('pizza_detail', pizza_id=pizza.id)
    else:
        form = CommentForm()

    return render(request, 'pizzas/pizza_detail.html', {
        'pizza': pizza,
        'form': form,
        'comments': comments
    })
