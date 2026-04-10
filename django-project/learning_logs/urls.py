"""Defines the URL patterns for the learning_log project."""
from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView


from . import views

app_name = 'learning_logs'

urlpatterns = [
    # Home page
    path('', views.index, name='index'),
    # page that shows all topics
    path('topics/', views.topics, name='topics'),
    path('topics/<int:topic_id>/', views.topic, name='topic'),
    
    # page for a new topic
    path('new_topic/', views.new_topic, name='new_topic'),
    path('new_entry/<int:topic_id>/', views.new_entry, name='new_entry'),
    path('logout/', LogoutView.as_view(next_page='learning_logs:index'), name='logout'),
    path('edit_entry/<int:entry_id>/', views.edit_entry, name='edit_entry'),

]
