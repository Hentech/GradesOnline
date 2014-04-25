# A new stylish gradeviewer
Grades Online is just like the bsd405 gradeviewer except it provides many more features, it is also much more, I want to say stylish? It works on the Gradebook node module that was developed by close friend of Hentech Laboratories, Henry Troutman.
## If you want to host it on your own
```
git clone https://github.com/Hentech/GradesOnline.git
cd GradesOnline
npm install
node app.js
```

You can test it out [here](http://henrytroutman.com:8001), but beware it is not using https for the login for lack of funding.

I would show images but my grades are bad, maybe someone could contribute, but currently you can see your classes with your grade described with a progress bar, upon clicking the "show" button a list of the respective class' assignments will appear and the progress bar will now contain divisions that represent the categories that make up your grade.
There will soon be a page that will give you updates on either changes in any of your grades, an assignment being entered, and an assignment overdue.