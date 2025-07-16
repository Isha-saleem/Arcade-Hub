# FINGER EXERCISE

# Finger Exercise Lecture 1
# Assume three variables are already defined for you: a, b, and c. Create a variable called total
#that adds a and b then multiplies the result by c. Include a last line in your code to print 
# the value: print(total)
#CODE:
# a,b,c = 1,5,8
# total = (a+b)*c
# print(total)

# Finger Exercise Lecture 2
# Assume you are given a variable named number (has a numerical value). Write a piece of 
# Python code that prints out one of the following strings: 
#=> positive if the variable number is positive
#=> negative if the variable number is negative
#=> zero if the variable number is equal to zero
#CODE:
# number = int(input("Enter number:"))
# if number > 0:
#     print("Positive")
# elif number < 0:
#     print("Negative")
# else:
#     print("Zero")

# Finger Exercise Lecture 3
# Assume you are given a positive integer variable named N. Write a piece of Python code that 
# prints hello world on separate lines, N times. You can use either a while loop or a for loop.
#CODE:
# N = 3
# for i in range(N):
#     print("Hello world")

# Finger Exercise Lecture 4
# Assume you are given a positive integer variable named N. Write a piece of Python code that
# finds the cube root of N. The code prints the cube root if N is a perfect cube or it prints error if
# N is not a perfect cube. Hint: use a loop that increments a counter—you decide when the 
# counter should stop.
#CODE:
# N = 27
# i = 1
# while i**3 < N:
#     i += 1
# if i**3 == N:
#      print(i)
# else:
#      print("error")

# Finger Exercise Lecture 5
# Assume you are given a string variable named my_str. Write a piece of Python code that 
# prints out a new string containing the even indexed characters of my_str. For example, if 
# my_str = "abcdefg" then your code should print out aceg.
#CODE:
# my_str = "abcdefg"
# new_str = []
# for i in range(len(my_str)):
#     if i % 2 == 0:
#         new_str.append(my_str[i])
#     else:
#         continue
# print("".join(new_str))

# Finger Exercise Lecture 6
# Assume you are given an integer 0 \<= N \<= 1000. Write a piece of Python code that uses 
# bisection search to guess N. The code prints two lines: count: with how many guesses it took 
# to find N, and answer: with the value of N. Hints: If the halfway value is exactly in between two 
# integers, choose the smaller one
#CODE:
num = 876
low = 0
high = 1001
count = 1
guess = (low+high)/2
while guess == num:
 count += 1
 if guess > num:
    print("High")
    guess = (high+low)/2

 else:
    print("Low")
