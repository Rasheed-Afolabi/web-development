
# 🍕 Pizzeria Django Project

This is a sample Django web application for managing a Pizzeria. It allows users to view pizzas, see their toppings, and post comments. Admins can manage pizzas, toppings, and comments via Django’s admin interface.

---

## 📁 Project Structure

```
Pizzeria/
├── manage.py               # Main entry point to run the app
├── db.sqlite3              # SQLite database file
├── Pizzeria/               # Project settings and URL configuration
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── pizzas/                 # App that handles pizza logic
│   ├── models.py           # Pizza, Topping, Comment models
│   ├── views.py            # Home, list, detail views
│   ├── templates/pizzas/   # HTML templates
│   └── ...
├── media/                  # Folder for uploaded images
└── requirements.txt        # Python dependencies (optional)
```

---

## ▶️ How to Run

### 1. Install Dependencies
Make sure you have Python and Django installed:
```bash
pip install django
```

### 2. Apply Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser (Admin)
```bash
python manage.py createsuperuser
```

### 4. Run Server
```bash
python manage.py runserver
```
Visit: http://127.0.0.1:8000

---

## 🧑‍💻 Features

- View pizzas and toppings
- Comment on individual pizzas
- Admin panel to manage all content
- Image upload for each pizza
- Clean and interactive frontend

---

## 📸 Screenshots

- Home page with intro and link to pizzas
- Pizza list with images
- Detail page with toppings and comments
- Comment form for users

---

## 🔐 Admin Login

Go to: http://127.0.0.1:8000/admin  
Use the credentials from `createsuperuser`

---

## 🚀 Future Enhancements (Optional)

- User authentication
- Star ratings for pizzas
- Order simulation or cart feature
- Filtering and search

---

Built with ❤️ using Django
