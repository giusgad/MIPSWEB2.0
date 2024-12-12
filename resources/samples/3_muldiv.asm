	.text
	.globl main
main:
	li $t0 100 # s1<-100
	li $t1 45 # s2<-45

	# moltiplicazione con istruzione MIPS
	mult $t0, $t1 # [Hi, Lo]<-s1*s2
	mflo $t2 # s0<-Lo

	# stessa moltiplicazione usando la pseudo-istruzione mul
	mul $t3, $t0, $t1 # s0<-s1*s2

	# divisione con istruzione MIPS
	div $t0, $t1 # Hi<-s1%s2, Lo<-s1/s2
	mflo $t4 # s0<-Lo

	# stessa divisione usando la pseudo-istruzione div
	# ATTENZIONE: sia l'istruzione che la pseudo-istruzione si chiamano 'div'!
	div $t5, $t0, $t1 # s0<-s1/s2